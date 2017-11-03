<?php

/*------------------------------------------------------------------------
 # SM Basic Products - Version 1.0.0
 # Copyright (c) 2014 YouTech Company. All Rights Reserved.
 # @license - Copyrighted Commercial Software
 # Author: YouTech Company
 # Websites: http://www.magentech.com
-------------------------------------------------------------------------*/

class Sm_PageBuilder_Model_Observer {

    public function injectHtml(Varien_Event_Observer $observer) {
        if (!defined('MAGENTECH_CLEAR_CACHE')) {
			$block  = $observer->getBlock();
			if($block instanceof Mage_Adminhtml_Block_Cache_Additional) {
				$transport = $observer->getTransport();
				$insert =
					'<tr>
						<td class="scope-label">
							<button onclick="setLocation(\'' . Mage::helper('adminhtml')->getUrl('adminhtml/smclear/index') . '\')" type="button" class="scalable">
								<span>' . Mage::helper('adminhtml')->__('Flush SM Cache') . '</span>
							</button>
						</td>
						<td class="scope-label">' . Mage::helper('adminhtml')->__('SM uses Cache Lite.') . '</td>
					</tr>';

				$dom = new DOMDocument();
				$dom->loadHTML($transport->getHtml());
				$td = $dom->createDocumentFragment();
				$td->appendXML($insert);
				$dom->getElementsByTagName('table')->item(1)->insertBefore($td, $dom->getElementsByTagName('table')->item(1)->firstChild);
				$transport->setHtml($dom->saveHTML());
				
				define('MAGENTECH_CLEAR_CACHE', 1);
			}
			
		}
    }

	public function renderShortCode(Varien_Event_Observer $observer){
		$collection = $observer->getPagebuilder();
		$page_id = $collection->getPageId();
		$shortcode = '{{widget type="pagebuilder/page_preview" page_id="'.$page_id.'"}}';
		$model = Mage::getModel('pagebuilder/page');
		$model->setPageId($page_id)
			->setPageShortcode($shortcode);
		try{
			$model->save();
		}
		catch (Mage_Core_Exception $e){
			Mage::getSingleton('adminhtml/session')->addError($e->getMessage());
			return;
		}
		catch (Exception $e)
		{
			Mage::getSingleton('adminhtml/session')->addError($e->getMessage());
			return;
		}
	}
}
